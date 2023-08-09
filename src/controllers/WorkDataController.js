const AppError = require("../utils/AppError")
const knex = require("../database/knex");

class WorkDataController{
    
    async create(request,response){
      const {machine_id, available, working} = request.body

      const zDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium'
      });

      const timestamp = zDate;

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
      const workdata = await knex("workdata").where({machine_id: machine.id}).orderBy("timestamp")

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
      
      const machineWithData = datas.map(data => {
        if(data.working){
          work.push(data.timestamp);
        }
        
        if(data.working){
          availeble.push(data.timestamp);
        }
        
        // const dataMachineWork = datas.filter(status => status.working == true)
        // return{
        //   ...data, 
        //   data: dataMachine
        // }
      })
  
      return response.json(work)
  
    }

  }
  module.exports = WorkDataController