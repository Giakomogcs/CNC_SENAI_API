const {Router} = require("express")
const machineRoutes = require("./machine.routes")

const routes = Router()
routes.use("/machine", machineRoutes)

module.exports = routes