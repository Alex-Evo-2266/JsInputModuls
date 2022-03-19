
export function circleInput(root,widthroot,heightroot,options={}) {
  // const {height, width} = root.getBoundingClientRect()
  if (!root)
  {
    console.error("circleInput: root component not found")
    return
  }
  if (!widthroot || !heightroot)
  {
    console.error("circleInput: size component not found")
    return
  }

  const height = heightroot
  const width = widthroot
  const min_side = (height<width)?height:width
  let raf

  const circles = options.circles || [{}]
  const count_circle = circles.length
  const stroke_width = options.width || 20
  const x = options.x || width / 2
  const y = options.y || height / 2
  const padding = options.padding || 5
  const margin = options.margin || 0
  const radius = options.r || (min_side / 2) - margin*2 - stroke_width/2

  const proxy = new Proxy({},{
    set(...args){
      const result = Reflect.set(...args)
      raf = requestAnimationFrame(paint)
      return result
    }
  })
  proxy.items = []
  for (var i = 0; i < count_circle; i++) {
    proxy.items[i] = {data:0,function:()=>{},color:(circles[i].indicator&&circles[i].indicator.color)?circles[i].indicator.color:"#f00"}
  }

  root.addEventListener('mousedown',mousedown)
  document.addEventListener('mouseup',mouseup)

  let c = document.createElement('div')
  c.innerHTML = `<svg class="circle-indicator">
                ${circles.map((item,index)=>{
                  const cR = item?.radius ?? radius - (stroke_width + padding)*index
                  return(`
                    <g data-el="group" data-id="${index}">
                    ${(!item.backCircle || !item.backCircle.delete)?`<circle fill="none" class="circleRange-base" data-el="base" data-type="base" cx="${x}" cy="${y}" r="${cR}"></circle>`:""}
                    ${(!item.indicator ||!item.indicator.delete)?`<circle fill="none" class="circleRange-indicator" data-type="${item.type}" data-el="indicator" cx="${x}" cy="${y}" r="${cR}"></circle>`:""}
                    ${(!item.point ||!item.point.delete)?`<circle fill="none" class="circleRange-point" data-type="${item.type}" data-el="point" cx="${x}" cy="${y}" r="${cR}"></circle>`:""}
                    </g>
                    `)
                }).join('')}
              </svg>`
  const $svg = c.firstChild
  c.style.width = widthroot + "px"
  c.style.height = heightroot + "px"
  $svg.style.width = "100%"
  $svg.style.height = "100%"
  root.append(c)

  function mousedown(event) {
    const type = event.target.dataset.type
    if(type === "range"){
      const index = event.target.parentNode.dataset.id
      const max = circles[index].max || 100
      const min = circles[index].min || 0
      document.onmousemove = (e)=>{
        let oldval = proxy.items[index].data
        let range = event.target
        const sizeLine = getsizeline(circles[index].style)
        let center_x = (range.r.baseVal.value) + range.getBoundingClientRect().left
        let center_y = (range.r.baseVal.value) + range.getBoundingClientRect().top
        let pos_x = e.pageX
        let pos_y = e.pageY
        let delta_y =  center_y - pos_y
        let delta_x = center_x - pos_x
        let angle = Math.atan2(delta_y, delta_x) * (180 / Math.PI)
        if(sizeLine === 270) angle = angle + 45

        if(angle < 0)
          angle = 360 + angle
        if(angle < 0)
          angle = 0
        if(angle>sizeLine && oldval>90)
          angle=sizeLine
        else if(angle>sizeLine && oldval<90)
          angle = 0

        let oldRange = (sizeLine - 0)
        let newRange = (max - min)
        let newValue = (((angle - 0) * newRange) / oldRange) + min
        if(proxy.items[index].data !== Math.round(newValue)){
          setData(index,Math.round(newValue))
          if(typeof(onchange) === "function"){
            onchange(t)
          }
        }
      }
    }
  }

  function mouseup() {
    document.onmousemove = null
  }

  function paint() {
    const groups = root.querySelectorAll('[data-el="group"]')
    groups.forEach((item) => {
      const config = circles[item.dataset.id]
      const min = config.min || 0
      const max = config.max || 100
      const style = config.style || "circle"
      let data = proxy.items[item.dataset.id].data

      const base = item.querySelector('[data-el="base"]')
      const confBase = config.backCircle || {}
      if(base){
        base.style.strokeLinecap = (config.rounding)?"round":""
        scalePaint(base,100,style,0,100,confBase.color,confBase.width)
      }
      const indicator = item.querySelector('[data-el="indicator"]')
      const confIndicator = config.indicator || {}
      if(indicator){
        indicator.style.strokeLinecap = (config.rounding)?"round":""
        scalePaint(indicator,data,style,min,max,proxy.items[item.dataset.id].color,confIndicator.width)
      }
      const point = item.querySelector('[data-el="point"]')
      const confPoint = config.point || {}
      if (point) {
        point.style.strokeLinecap = "round"
        scalePaint(point,data,style,min,max,confPoint.color||proxy.items[item.dataset.id].color,confPoint.width)
      }
    });
  }

  function setData(index,value){
    if(index>count_circle-1)return
    if(proxy.items[index].data === value) return
    let arr = proxy.items.slice()
    arr[index].data = value
    proxy.items = arr
    const f = proxy.items[index].function
    f(proxy.items[index].data)
  }

  function linc(index,fun){
    if(index>count_circle-1)return
    let arr = proxy.items.slice()
    arr[index].function = fun
    proxy.items = arr
  }

  function setColor(index,color) {
    if(index>count_circle-1)return
    let arr = proxy.items.slice()
    arr[index].color = color
    proxy.items = arr
  }

  function getLine(index) {
    return {
      set value(num){
        setData(index,num)
      },
      get value(){
        return proxy.items[index].data
      },
      linc(fun){
        linc(index,fun)
      },
      set color(color){
        setColor(index,color)
      },
      get color(){
        return proxy.items[index].color
      }
    }
  }

  function scalePaint(item,data,style,min,max,color,width) {
    const defStrokeDashoffset = lineParams(item.r.baseVal.value,style)[0]
    const sizeScale = lineParams(item.r.baseVal.value,style)[1]
    const arc = ((data-min)*sizeScale)/(max-min)

    item.style.stroke = color || "#333"
    item.style.strokeWidth = width || 20

    if(item.dataset.el==="point"){
      if(data === max && style === "semicircle")
        item.style.strokeDashoffset = 0
      else
        item.style.strokeDashoffset = defStrokeDashoffset - arc
      item.style.strokeDasharray = `${0}, ${item.r.baseVal.value*Math.PI*2}`
    }else{
      item.style.strokeDashoffset = defStrokeDashoffset
      item.style.strokeDasharray = `${arc}, ${item.r.baseVal.value*Math.PI*2-arc}`
    }
  }

  return{
    destroy(){
      root.removeEventListener('mousedown',mousedown)
      document.removeEventListener('mouseup',mouseup)
    },
    getLine
  }
}

function getsizeline(style) {
  return (style === "semicircle")?
        180:
        (style === "brokenСircle")?
        270:
        360
}

function lineParams(r,style) {
  if(style === "semicircle")
    return [
      r*Math.PI,
      r*Math.PI
    ]
  else if(style === "brokenСircle")
    return [
      r*Math.PI*1.25,
      r*Math.PI*1.5
    ]
  else
  return [
    r*Math.PI,
    r*Math.PI*2
  ]
}
