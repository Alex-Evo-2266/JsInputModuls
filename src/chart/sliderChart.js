import {computeBoundaries, toCoords,line,computeYRatio,computeXRatio} from './utils'

const HEIGHT = 40
const DPI_HEIGHT = HEIGHT*2

function noop() {}

export function sliderChart(root,data,DPI_WIDTH) {
  const WIDTH = DPI_WIDTH/2
  const MIN_WIDTH = WIDTH * 0.05
  const canvas = root.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  let nextFn = noop
  canvas.style.width = WIDTH + 'px'
  canvas.style.height = HEIGHT + 'px'
  canvas.width = DPI_WIDTH
  canvas.height = DPI_HEIGHT

  const $left = root.querySelector('[data-el="left"]')
  const $window = root.querySelector('[data-el="window"]')
  const $right = root.querySelector('[data-el="right"]')

  root.addEventListener('mousedown',mousedown)
  document.addEventListener('mouseup',mouseup)

  function next() {
    nextFn(getPosition())
  }

  function mousedown(event) {
    const type = event.target.dataset.type
    const startX = event.pageX
    const dimension = {
      left: parseInt($window.style.left),
      right: parseInt($window.style.right),
      width: parseInt($window.style.width),
    }
    if(type === "window"){
      document.onmousemove = e =>{
        const delta = startX - e.pageX

        if(delta === 0){
          return
        }
        const left = dimension.left - delta
        const right = WIDTH - left - dimension.width
        setPosition(left,right)
        next()
      }
    }
    else if(type === "left"||type === "right") {
      document.onmousemove = e =>{
        const delta = startX - e.pageX
        if(delta === 0){
          return
        }
        if(type === "left"){
          const left = WIDTH - (dimension.width + delta) - dimension.right
          const right = WIDTH - (dimension.width + delta) - left
          setPosition(left,right)
        }
        else{
          const right = WIDTH - (dimension.width - delta) - dimension.left
          setPosition(dimension.left,right)
        }
        next()
      }
    }
  }

  function mouseup() {
    document.onmousemove = null
  }

  function getPosition() {
    const left = parseInt($left.style.width)
    const right = WIDTH - parseInt($right.style.width)
    return [(left*100)/WIDTH,(right*100)/WIDTH]
  }

  function setPosition(left, right) {
    const w = WIDTH - left - right

    if(w < MIN_WIDTH){
      $window.style.width = MIN_WIDTH + "px"
      return
    }
    if(left<0){
      $window.style.left = "0px"
      $left.style.width = "0px"
      return
    }
    if(right<0){
      $window.style.right = "0px"
      $right.style.width = "0px"
      return
    }

    $window.style.left = left + "px"
    $window.style.width = w + "px"
    $window.style.right = right + "px"

    $left.style.width = left + "px"
    $right.style.width = right + "px"
  }

  const defWidth = WIDTH * 0.3
  setPosition(0, WIDTH - defWidth)
  const [yMin, yMax] = computeBoundaries(data)
  const yRatio = computeYRatio(DPI_HEIGHT,yMin,yMax)
  const xRatio = computeXRatio(DPI_WIDTH,data.columns[0].length)

  const yData = data.columns.filter((col)=>data.types[col[0]]==="line")
  yData
  .map(toCoords(xRatio,yRatio,DPI_HEIGHT,-5,yMin))
  .forEach((coords,idx) => {
    const color = data.colors[yData[idx][0]]
    line(ctx,coords, {color})
  })

  return{
    destroy(){
      canvas.removeEventListener('mousedown',mousedown)
      document.removeEventListener('mouseup',mouseup)
    },
    subscribe(fn){
      nextFn = fn
      fn(getPosition())
    }
  }
}
