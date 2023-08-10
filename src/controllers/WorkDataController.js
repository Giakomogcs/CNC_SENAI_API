const AppError = require("../utils/AppError")
const knex = require("../database/knex");
const sqliteConnection = require('../database/sqlite')
const {differenceInMinutes} = require("date-fns")

class WorkDataController{
    
    async create(request,response){
      const {machine_id, available, working} = request.body
      const database = await sqliteConnection()
      
      const machine = await knex("machines").where({id:machine_id}).first()
      //const machine = await database.get("SELECT * FROM machines WHERE id = (?)", [machine_id])
      
      if(!machine){
        throw new AppError("Não foi possível encontrar a máquina (machine_id)")
      }

      const timestamp = new Date()

      if(!machine_id){
        throw new AppError("Nome da máquina (machine_id) é obrigatório")
      }

      if(available == working){
        throw new AppError("Não é possivel estar disponivel e trabalhando ao mesmo tempo")
      }

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
      let work = []
      let availeble = []
      
      
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
      

      datas.map(data => {
        const timer = new Date(data.timestamp)
        console.log(data.timestamp)

        // if(data.working){
        //   work.push(data.timestamp);
        // }
        
        // if(data.available){
        //   availeble.push(data.timestamp);
        // }
      })
  
      return response.json({
        datas,
        //work: work,
        //available: availeble
      })
  
    }

  }
  module.exports = WorkDataController