const AppError = require("../utils/AppError")
const sqliteConnection = require('../database/sqlite')

class MachineController{
    async create(request,response){
      const {name} = request.body

      const database = await sqliteConnection()

      if(!name){
        throw new AppError("Nome é obrigatório")
      }

      const checkMachineExists = await database.get("SELECT * FROM machines WHERE name = (?)", [name])

      if(checkMachineExists){
        throw new AppError("Essa máquina já está em uso")
      }

      await database.run("INSERT INTO machines (name) VALUES (?)",
      [name])

      response.status(201).json({name})
    }


    status(request,response){
      const {name, available, working} = request.body

      if(!name){
        throw new AppError("Nome é obrigatório")
      }

      if(available == working){
        throw new AppError("Não é possivel estar disponivel e trabalhando ao mesmo tempo")
      }
      
      response.status(201).json({name, available, working})
    }


  }
  module.exports = MachineController