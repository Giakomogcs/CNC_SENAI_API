const AppError = require("../utils/AppError")
const knex = require("../database/knex");
const sqliteConnection = require('../database/sqlite');
const moment = require("moment/moment");

class WorkDataController{
    
    async create(request,response){
      let {machine_id, available, working} = request.body

      working ? working = working : working = !available
      available ? available = available : available = !working

      console.log(working)
      console.log(available)
      
      const machine = await knex("machines").where({id:machine_id}).first()
      
      if(!machine){
        throw new AppError("Não foi possível encontrar a máquina (machine_id)")
      }

      
      if(!machine_id){
        throw new AppError("Nome da máquina (machine_id) é obrigatório")
      }
      
      if(available == working){
        throw new AppError("Não é possivel estar disponivel e trabalhando ao mesmo tempo")
      }

      const zDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium'
      });

      const timestamp = zDate

      await knex("workdata").insert({
        machine_id,
        available,
        working,
        timestamp
      });
      
      
      return response.json();
      
    }
    
    async status(request,response){
      const{name} = request.params
      const {start, end} = request.query;
      
      
      let datas
      let work
      let available
      let times = []
      let types = []
      
      const machine = await knex("machines").where({name}).first()

      if (!machine){
        throw new AppError("Não foi possível encontrar a máquina (machine_id)")
      }
      
      else{
        datas = await knex("workdata")
        .select([
          "workdata.machine_id",
          "workdata.working",
          "workdata.available",
          "workdata.timestamp"
        ])
        .where("workdata.machine_id", machine.id)
        //.where("workdata.working", true)
        //.where("workdata.available", true)
        .where('workdata.timestamp', '>=', start)
        .where('workdata.timestamp', '<=', end)
        .groupBy("workdata.timestamp")
        .orderBy("workdata.timestamp")
      }
      
      let i = 0
      let auxTime = 0


      datas.map(data => {

        var math = moment(data.timestamp, "DD/MM/YYYY HH:mm:ss").diff(moment(times[times.length-1], "DD/MM/YYYY HH:mm:ss"))
        var mathtHours = moment.duration(math).asHours()

        
        if(i != 0 && i%2 != 0){
          //console.log(`${data.timestamp} e ${times[times.length-1]}`)
          auxTime = mathtHours + auxTime
        }
        
        times.push(data.timestamp);
        types.push(data.working);
        i++
      })

      var shift
      var shiftHours

      if(moment(end, "DD/MM/YYYY HH:mm:ss") > new Date()){
        shift = moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(moment(times[0], "DD/MM/YYYY HH:mm:ss"))
        shiftHours = moment.duration(shift).asHours()

      } else{
        //shift = moment(times[times.length-1], "DD/MM/YYYY HH:mm:ss").diff(moment(times[0], "DD/MM/YYYY HH:mm:ss"))
        //shiftHours = moment.duration(shift).asHours()

        shift = moment(end, "DD/MM/YYYY HH:mm:ss").diff(moment(start, "DD/MM/YYYY HH:mm:ss"))
        shiftHours = moment.duration(shift).asHours()
      }


      var shiftInit = moment(times[0], "DD/MM/YYYY HH:mm:ss").diff(moment(start, "DD/MM/YYYY HH:mm:ss"))
      var shiftInitHours = moment.duration(shiftInit).asHours()

      var shiftFinal = moment(end, "DD/MM/YYYY HH:mm:ss").diff(moment(times[times.length-1], "DD/MM/YYYY HH:mm:ss"))
      var shiftFinalHours = moment.duration(shiftFinal).asHours()


      if (types[0] == true){
        work = auxTime 
        available = shiftHours - (work + shiftInitHours)

      } else{
        available = auxTime
        work = shiftHours - (available)
      }

      if (types[types.length-1] == true){
        work = work + shiftFinalHours

      } else{
        available = available + shiftFinalHours
      }

      return response.json({
        datas,
        work: work,
        available: available,
        shift: shiftHours + shiftFinalHours
      })
  
    }

  }
  module.exports = WorkDataController