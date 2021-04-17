import {d as dataGraf} from './chart/data.js'
import {chart} from './chart/chart.js'
import {circleRange} from './circleRange/index.js'
import './chart/style.scss'
import './circleRange/style.css'

const t = document.getElementById("tg-chart")
const graf = chart(t,dataGraf)
graf.init()
const test = document.getElementById("test-div")
const renge = circleRange(test,{margin: 5,circles:[
  {
    type:"range",
    style: "brokenСircle",
    min:0,
    max:100,
    backCircle:{
      color: "#456",
      width: 20
    },
    indicator:{
      color:"#098",
      width:20
    },
    point:{
      color:"#ff0",
      width:30,
    }
  }
  ,{
    type:"indicator",
    style: "circle",
    min:0,
    max:200,
    indicator:{
    },
    point:{
      delete:true
    }
  }
]})

const line1 = renge.getLine(0)
const line2 = renge.getLine(1)
console.log(line1);
// line1.value = 45
line1.color = "#00f"
line2.color = "#00f"
line1.linc((data)=>{
  console.log(data)
  line2.value=data
})
