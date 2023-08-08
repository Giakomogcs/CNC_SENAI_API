const AppError = require("../utils/AppError")

class MachineController{
    create(request,response){
      const {name} = request.body

      if(!name){
        throw new AppError("Nome é obrigatório")
      }

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