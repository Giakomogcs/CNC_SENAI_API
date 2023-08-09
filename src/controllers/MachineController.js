const AppError = require("../utils/AppError")
const sqliteConnection = require('../database/sqlite')

class MachineController{
    async create(request,response){
      const {name} = request.body

      const database = await sqliteConnection()

      const zDate = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'medium'
      });

      if(!name){
        throw new AppError("Nome é obrigatório")
      }

      const checkMachineExists = await database.get("SELECT * FROM machines WHERE name = (?)", [name])

      if(checkMachineExists){
        throw new AppError("Essa máquina já está em uso")
      }

      await database.run("INSERT INTO machines (name,created_at,updated_at) VALUES (?,?,?)",
      [name,zDate,zDate])

      response.status(201).json()
    }


  }
  module.exports = MachineController