import {toDate,isOver,circle,line,computeBoundaries,toCoords,computeYRatio,computeXRatio} from './utils'
import {sliderChart} from './sliderChart'
import {tooltip} from './tooltip'

export function chart(root,optinos={}) {
  const WIDTH = optinos.width||600
  const HEIGHT = optinos.height||200
  const PADDING = optinos.padding||40
  const DPI_WIDTH = WIDTH*2
  const DPI_HEIGHT = HEIGHT*2
  const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2
  const VIEW_WIDTH = DPI_WIDTH
  const ROWS_COUNT = optinos.rows||5
  const COLUS_COUNT = optinos.columns||4

  const canvas = root.querySelector('[data-el="main"]')
  const tip = tooltip(root.querySelector('[data-el="tg-chart-tooltip"]'))
  const ctx = canvas.getContext('2d')
  let raf
  canvas.style.width = WIDTH + 'px'
  canvas.style.height = HEIGHT + 'px'
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT

  canvas.addEventListener('mousemove',mousemove)
  canvas.addEventListener('mouseleave',mouseleave)

  const proxy = new Proxy({},{
    set(...args){
      const result = Reflect.set(...args)
      raf = requestAnimationFrame(paint)
      return result
    }
  })
  proxy.data={
    columns:[
      [
        "x",
      ],
      [
        "y0",
      ],
    ],
    types:{
      y0: 'line',
      x: 'x',
    },
    names: {
      y0: '#0',
    },
    colors: {
      y0: '#3DC23F',
    },
  }

  const slider = sliderChart(root.querySelector('[data-el="slider"]'),proxy.data,DPI_WIDTH)
  if(slider)
    slider.subscribe((pos)=>{
      proxy.pos = pos
    })

  function mousemove({clientX, clientY}) {
    const {left, top} = canvas.getBoundingClientRect()
    proxy.mouse = {
      x:(clientX - left) * 2,
      tooltip:{
        left: clientX - left,
        top: clientY - top
      }
    }
  }

  function mouseleave() {
    proxy.mouse = null
    tip.hide()
  }

  function clear() {
    ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT)
  }

  function paint() {
    clear()

    const length = proxy.data.columns[0].length
    const leftpoz = (proxy.pos&&proxy.pos[0]!==null)?proxy.pos[0]:(WIDTH/2<length)?length-WIDTH/4:1
    const rightpoz = (proxy.pos&&proxy.pos[1])?proxy.pos[1]:length
    const leftIndex = Math.round((length * leftpoz)/100)
    const rightIndex = Math.round((length * rightpoz)/100)

    const columns = proxy.data.columns.map((col)=>{
      const res = col.slice(leftIndex,rightIndex)
      if(typeof res[0]!=="string"){
        res.unshift(col[0])
      }
      return res
    })

    const [yMin, yMax] = computeBoundaries({columns,types:proxy.data.types})

    const yRatio = computeYRatio(VIEW_HEIGHT,yMin,yMax)
    const xRatio = computeXRatio(VIEW_WIDTH,columns[0].length)


    const yData = columns.filter((col)=>proxy.data.types[col[0]]==="line")
    const xData = columns.filter((col)=>proxy.data.types[col[0]]!=="line")[0]

    yAxis(yMin, yMax)
    xAxis(xData,yData,xRatio)

    yData
    .map(toCoords(xRatio,yRatio,DPI_HEIGHT,PADDING,yMin))
    .forEach((coords,idx) => {
      const color = proxy.data.colors[yData[idx][0]]
      line(ctx,coords, {color})

      for (const [x,y] of coords) {
        if(isOver(proxy.mouse, x, coords.length, DPI_WIDTH)){
          circle(ctx, [x, y], color)
          break
        }
      }
    })
  }

  function xAxis(xData,yData,xRatio){
    const step = Math.round(xData.length/COLUS_COUNT)
    ctx.beginPath()
    for (var i = 1; i < xData.length; i++) {
      const x = i * xRatio

      if((i - 1)%step === 0){
        const text = toDate(xData[i])
        ctx.fillText(text.toString(),x, DPI_HEIGHT)
      }

      if(isOver(proxy.mouse, x, xData.length,DPI_WIDTH)){
        ctx.save()
        ctx.moveTo(x, PADDING)
        ctx.lineTo(x, DPI_HEIGHT - PADDING)
        ctx.restore()
        tip.show(proxy.mouse.tooltip,{
          title: toDate(xData[i]),
          items:yData.map((col)=>({
            color:proxy.data.colors[col[0]],
            name:proxy.data.names[col[0]],
            value:col[i + 1],
          })),
        })
      }
    }
    ctx.stroke()
    ctx.closePath()
  }

  function yAxis(yMin, yMax){
    const step = VIEW_HEIGHT/ROWS_COUNT
    const textStep = (yMax - yMin)/ROWS_COUNT

    ctx.beginPath()
    ctx.lineWidth = 1
    ctx.strokeStyle = "#bbb"
    ctx.font = 'normal 20px Helvetica,sana-serif'
    ctx.fillStyle = "#96a2aa"
    for (var i = 1; i <= ROWS_COUNT; i++) {
      const y = step * i
      const text = Math.round(yMax - textStep*i)
      ctx.fillText(text.toString(), 5, y + PADDING - 10)
      ctx.moveTo(0, y + PADDING)
      ctx.lineTo(DPI_WIDTH,y + PADDING)
    }
    ctx.stroke()
    ctx.closePath()
  }

  return {
    init(){
      paint()
    },
    destroy(){
      cancelAnimationFrame(ref)
      canvas.removeEventListener('mousemove',mousemove)
      canvas.removeEventListener('mouseleave',mouseleave)
    },
    set data(data1){
      proxy.data = data1
    },
    get data(){
      return proxy.data
    }
  }
}
