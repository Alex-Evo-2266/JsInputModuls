
export function circleRange(root,options={}) {
  const {height, width} = root.getBoundingClientRect()
  const min_side = (height<width)?height:width
  let raf

  const circles = options.circles || [{
    type:"indicator",
    size:"circle",
    style:"line"
  }]
  const count_circle = circles.length
  const stroke_width = options.width || 20
  const x = options.x || width / 2
  const y = options.y || height / 2
  const fonColor = options.color || "#555"
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
    proxy.items[i] = {data:0,function:()=>{},color:circles[i].color}
  }

  root.addEventListener('mousedown',mousedown)
  document.addEventListener('mouseup',mouseup)

  // <circle class="circleRange-point" data-el="point" data-id="${index}" data-size="${item.size||"circle"}" data-style="${item.style||"line"}" data-type="${item.type||"indicator"}" cx="${x}" cy="${y}" r="${cR}"></circle>

  let c = document.createElement('div')
  c.innerHTML = `<svg class="circle-indicator">
                ${circles.map((item,index)=>{
                  const cR = radius - (stroke_width + padding)*index
                  return(`
                    <circle class="circleRange-base" data-el="base" data-size="${item.size||"circle"}" cx="${x}" cy="${y}" r="${cR}"></circle>
                    <circle class="circleRange-indicator" data-el="indicator" data-id="${index}" data-size="${item.size||"circle"}" data-style="${item.style||"line"}" data-type="${item.type||"indicator"}" cx="${x}" cy="${y}" r="${cR}"></circle>
                    `)
                }).join('')}
              </svg>`
  const $svg = c.firstChild
  root.append($svg)

  function mousedown(event) {
    const type = event.target.dataset.type
    if(type === "range"){
      const index = event.target.dataset.id
      const max = circles[index].max || 100
      const min = circles[index].min || 0
      document.onmousemove = (e)=>{
        let oldval = proxy.items[index].data
        let range = event.target
        const sizeLine = getsizeline(range)
        let center_x = (range.r.baseVal.value) + range.getBoundingClientRect().left
        let center_y = (range.r.baseVal.value) + range.getBoundingClientRect().top
        let pos_x = e.pageX
        let pos_y = e.pageY
        let delta_y =  center_y - pos_y
        let delta_x = center_x - pos_x
        let angle = Math.atan2(delta_y, delta_x) * (180 / Math.PI)
        if(sizeLine[1] === 270) angle = angle + 45

        if(angle < 0)
          angle = 360 + angle
        if(angle < 0)
          angle = 0
        if(angle>sizeLine[1] && oldval>90)
          angle=sizeLine[1]
        else if(angle>sizeLine[1] && oldval<90)
          angle = 0

        let oldRange = (sizeLine[1] - 0)
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
    const baseCircles = root.querySelectorAll('[data-el="base"]')
    baseCircles.forEach((item,i) => {
      let conf = circles[i].backCircle || {}
      conf.color = conf.color||fonColor
      conf.width = conf.width||stroke_width
      scalePaint(item,100,conf)
    });
    const indicators = root.querySelectorAll('[data-el="indicator"]')
    indicators.forEach((item, i) => {
      let conf = {}
      conf.max = circles[i].max || 100
      conf.min = circles[i].min || 0
      conf.color = proxy.items[i].color || circles[i].color || "#f00"
      conf.width = circles[i].width || stroke_width
      scalePaint(item,proxy.items[i].data,conf)
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

  return{
    destroy(){
      root.removeEventListener('mousedown',mousedown)
      document.removeEventListener('mouseup',mouseup)
    },
    setData,
    linc,
    setColor
  }
}

function scalePaint(item,data,{max = 100, min = 0,color = "#f00", width = 20}) {
  let defStrokeDashoffset
  let sizeScale
  item.style.stroke = color
  item.style.strokeWidth = width
  if(item.dataset.size === "circle"){
    defStrokeDashoffset = item.r.baseVal.value*Math.PI
    sizeScale = item.r.baseVal.value*Math.PI*2
  }
  else if(item.dataset.size === "semicircle") {
    defStrokeDashoffset = item.r.baseVal.value*Math.PI
    sizeScale = item.r.baseVal.value*Math.PI
  }
  else if(item.dataset.size === "brokenСircle") {
    defStrokeDashoffset = item.r.baseVal.value*Math.PI*1.25
    sizeScale = item.r.baseVal.value*Math.PI*1.5
  }
  const arc = ((data-min)*sizeScale)/(max-min)

  if(item.dataset.style === "point"){
    if(data === max && item.dataset.size === "semicircle")
      item.style.strokeDashoffset = 0
    else
      item.style.strokeDashoffset = defStrokeDashoffset - arc
    item.style.strokeDasharray = `${0}, ${item.r.baseVal.value*Math.PI*2}`
  }
  else {
    item.style.strokeDashoffset = defStrokeDashoffset
    item.style.strokeDasharray = `${arc}, ${item.r.baseVal.value*Math.PI*2-arc}`
  }
}

function getsizeline(item) {
  return (item.dataset.size === "semicircle")?
        [item.r.baseVal.value*Math.PI,180]:
        (item.dataset.size === "brokenСircle")?
        [item.r.baseVal.value*Math.PI*1.5, 270]:
        [item.r.baseVal.value*Math.PI*2, 360]
}
