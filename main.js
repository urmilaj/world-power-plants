function viz(){
    const margin = { top: 40, left: 20, bottom: 40, right: 20 },
          width = 350-margin.right-margin.bottom,
          height = 300-margin.left-margin.top,
          w = 160,
          h = 160;

          
    const viz = d3.select("body")
                      

    const parseYear = d3.timeParse("%Y");

    Promise.all([d3.json("data/countries-50m.json"),
    d3.csv("data/dataFinal.csv",function(d){
          return{
          country : d.country,
          name : d.name,
          capacity : parseFloat(d.capacity_mw),
          lat : parseFloat(d.latitude),
          long : parseFloat(d.longitude),
          fuel : d.primary_fuel,
          year : parseYear(d.year)
          };
        })]).then(function(initialize){

            let world = initialize[0]
            let data = initialize[1]


            let countries = topojson.feature(world, world.objects.countries).features
            .map(d=>(d.plant = data.filter(v=>v.country==d.properties.name),d))
                       
            let projection = d3.geoMercator()
            
            const group = Array.from(d3.rollup(data,v=>v.length,d=>d.country,d=>d.fuel),([key,value])=>{
                return {
                    key,
                    value,
                    country: countries.filter(d=>d.properties.name==key),
                    plant: countries.filter(d=>d.properties.name==key)
                    }})

           
            let path = d3.geoPath().projection(projection)
            
        
            arc = d3.arc()
        .innerRadius(Math.min(width,height)/2-10)
        .outerRadius(Math.min(width,height)/2)

        pie = d3.pie()
        .value(d=>d[1])
        .sort(null)
        .padAngle(0.014)

        const color = d3.scaleOrdinal()
                        .range(["#8de4d3","#156b55","#00ff71","#cb7ff5","#e819eb","#c17c41","#bae342","#fea53b","#d53879","#d9c0c7","#e65216","#efd453","#167dbb","#4650ca","#c098fd"])

        const multiple = viz.selectAll("multiples")
                                .data(group)
                                .join("svg")
                                .attr("width",width+margin.left+margin.right)
                                .attr("height",height+margin.top+margin.bottom)
                                .attr("transform","translate(50,30)")
                                .attr("viewBox",[0,0,width,height])
                                .style("max-width","50%")
                                .append("g").attr("id",d=>d.key)
            
           multiple.append("g").attr("transform",`translate(${width/2},${height/2})`)
                               .attr("stroke","orange").attr("stroke-width",0.5)
                               .selectAll("path")
                               .data(d=>pie(d.value))
                               .join(enter=>{
                                   enter.append("path")
                                        .attr("class","donut").attr("id",(d,i)=>"donut"+i)
                                        .attr("d",d=>arc(d))
                                        .attr("fill",d=>color(d.data[0]))
                                        .style("opacity",1)
                                        .on("mouseover",mouse)
                                        .on("mouseout",douse)
                                        })
                               
            multiple.append("g").attr("class","map")
                     .attr("transform",`translate(60,35)`)
                               .selectAll("country")
                               .data(d=>d.country)
                               .join("path")
                               .attr("d",d=>(projection.fitSize([w,h],d),path(d)))
                                    .style("fill","none").attr("stroke","orange").style("opacity",1).attr("stroke-width",1.8)
                                    
            multiple.selectAll("plant").data(d=>d.plant).join("g").each(point).attr("visibility","hidden")
                                  
            function point(d) {
            
            projection.fitSize([w,h],d)

            d3.select(this).attr("transform",`translate(60,35)`)
                               .selectAll("circle")
                      .data(d=>d.plant)
                      .join("circle")
                      .attr("cx",d=>
                      projection([d.long,d.lat])[0])
                      .attr("cy",d=>
                          projection([d.long,d.lat])[1])
                      .attr("r",3.5).style("fill","none").style("opacity",0.8)
                      .style("stroke",d=>color(d.fuel)).attr("class",d=>d.fuel)
                      
            }
                                             
             multiple.append("text").attr("class","countryName")
                     .text(d=>d.key)
                     .attr("x",width/2)
                     .attr("y",-6.5)
                     .attr("text-anchor","middle")
                     .style("fill","orange")
                     
            function mouse(event,d){
                        d3.select(this).style("opacity",0.8).attr("stroke","rgb(61, 5, 68)").attr("stroke-width",3)
                        d3.select(this.parentNode.parentNode).selectAll("circle").filter(c=>c.fuel==d.data[0]).attr("visibility","visible")
                        d3.select(this.parentNode).append("g").attr("transform",`translate(${arc.centroid(d)})`)
                          .attr("class","label")
                          .append("text")
                          .attr("text-anchor","middle")
                        .text(d.data[0])
                          }

            function douse(event,d){
                        d3.select(this).style("opacity",1).attr("stroke","orange").attr("stroke-width",0.5)
                        d3.select(this.parentNode.parentNode).selectAll("circle").filter(c=>c.fuel==d.data[0]).attr("visibility","hidden")
                        d3.selectAll(".label").remove()
                     }
                         
            function power(){
                    d3.selectAll(".power").each(d=>{
                        power = d3.select(this)
                        pGroup = power.property("value")

                        if(power.property("checked")){
                            multiple.selectAll("."+pGroup).attr("visibility","visible")
                        }else{
                            multiple.selectAll("."+pGroup).attr("visibility","hidden")
                        }
                    })
                }

                d3.selectAll(".power").on("change",power)

                power()
    })
}