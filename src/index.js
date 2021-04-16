import {d as dataGraf} from './chart/data.js'
import {chart} from './chart/chart.js'
import {circleRange} from './circleRange/index.js'
import './chart/style.scss'
import './circleRange/style.css'

const t = document.getElementById("tg-chart")
const graf = chart(t,dataGraf)
graf.init()
const test = document.getElementById("test-div")
const renge = circleRange(test,{margin:5,circles:[
  {
    type:"range",
    size:"circle",
    style:"line",
    color: "#f00",
    backCircle:{
      color: "#400",
      width: 10
    }
  },
  {
    type:"range",
    size:"semicircle",
    style:"point"
  },
  {
    type:"range",
    size:"brokenСircle",
    style:"line"
  },
  {
    type:"range",
    size:"brokenСircle",
    style:"line"
  }
]})
renge.setData(0,60)
renge.setData(1,86)
renge.setData(2,45)
renge.setData(3,56)

renge.linc(0,(data)=>{
  console.log(`0 - ${data}`)
  // renge.setData(0,data)
})
renge.linc(1,(data)=>console.log(`1 - ${data}`))

renge.setData(1,45)
