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
  
      const machine = await knex("machines").where({name}).first()
      const workdata = await knex("workdata").where({machine_id: machine.id}).orderBy("timestamp")

      const machineWithData = workdata.map(workdata => {

        const dataMachine = workdata.filter(time => time.timestamp >= machine.created_at)
        return{
          ...machine, 
          data: dataMachine
        }
      })
  
      return response.json(machineWithData)
  
    }

  }
  module.exports = WorkDataController