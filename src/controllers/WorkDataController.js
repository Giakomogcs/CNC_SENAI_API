const AppError = require("../utils/AppError");
const knex = require("../database/knex");
const sqliteConnection = require("../database/sqlite");
const moment = require("moment/moment");

class WorkDataController {
  async create(request, response) {
    let { machine_id, available, working } = request.body;

    working ? (working = working) : (working = !available);
    available ? (available = available) : (available = !working);

    const machine = await knex("machines").where({ id: machine_id }).first();

    if (!machine) {
      throw new AppError("Não foi possível encontrar a máquina (machine_id)");
    }

    if (!machine_id) {
      throw new AppError("Nome da máquina (machine_id) é obrigatório");
    }

    if (available == working) {
      throw new AppError(
        "Não é possivel estar disponivel e trabalhando ao mesmo tempo"
      );
    }

    const zDate = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "medium",
    });

    const timestamp = zDate;

    await knex("workdata").insert({
      machine_id,
      available,
      working,
      timestamp,
    });

    return response.json();
  }

  async status(request, response) {
    const { name } = request.params;
    let { start, end } = request.query;

    if (!start) {
      // Se start não foi fornecido na query, defina-o como dois dias atrás do dia atual.
      const oneDaysAgo = new Date();
      oneDaysAgo.setDate(oneDaysAgo.getDate() - 1);
      start = oneDaysAgo.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      //.replace(/,/g, ""); // Remova a vírgula do formato
    }

    if (!end) {
      // Se end não foi fornecido na query, defina-o como o dia atual.
      const currentDate = new Date();
      end = currentDate.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      //.replace(/,/g, ""); // Remova a vírgula do formato
    }

    //start ? (start = start) : (start = new Date().getDate() - 2);
    //end ? (end = end) : (end = new Date().toLocaleDateString());

    let datas;
    let work = 0;
    let available = 0;
    let times = [];
    let types = [];

    const machine = await knex("machines").where({ name }).first();

    if (!machine) {
      throw new AppError("Não foi possível encontrar a máquina (machine_id)");
    } else {
      datas = await knex("workdata")
        .select([
          "workdata.machine_id",
          "workdata.working",
          "workdata.available",
          "workdata.timestamp",
        ])
        .where("workdata.machine_id", machine.id)

        .where("workdata.timestamp", ">=", start)
        .where("workdata.timestamp", "<=", end)
        .groupBy("workdata.timestamp")
        .orderBy("workdata.timestamp");
    }

    let i = 0;
    let auxTime = 0;

    const filteredDatas = datas.filter((data) => {
      const timestamp = moment(data.timestamp, "DD/MM/YYYY HH:mm:ss");

      return (
        timestamp.isSameOrAfter(moment(start, "DD/MM/YYYY HH:mm:ss")) &&
        timestamp.isSameOrBefore(moment(end, "DD/MM/YYYY HH:mm:ss"))
      );
    });

    datas = filteredDatas;

    datas.map((data) => {
      const cleanTimestamp = data.timestamp.replace(/[^0-9/: ,]/g, "");

      const math = moment(cleanTimestamp, "DD/MM/YYYY, HH:mm:ss").diff(
        moment(times[times.length - 1], "DD/MM/YYYY, HH:mm:ss")
      );

      const mathtHours = moment.duration(math).asHours();

      if (i != 0 && i % 2 != 0) {
        auxTime = mathtHours + auxTime;
      }

      times.push(data.timestamp);
      types.push(data.working);

      i++;
    });

    // Filtrar as datas entre start e end

    var shift;
    var shiftHours;

    if (moment(end, "DD/MM/YYYY HH:mm:ss") > new Date()) {
      //se a data final é maior que o dia atual muda para o dia atual
      shift = moment(new Date(), "DD/MM/YYYY HH:mm:ss").diff(
        moment(times[0], "DD/MM/YYYY HH:mm:ss")
      );
      shiftHours = moment.duration(shift).asHours();
    } else {
      shift = moment(end, "DD/MM/YYYY HH:mm:ss").diff(
        moment(start, "DD/MM/YYYY HH:mm:ss")
      );
      shiftHours = moment.duration(shift).asHours();
    }

    var shiftInit = moment(times[0], "DD/MM/YYYY HH:mm:ss").diff(
      moment(start, "DD/MM/YYYY HH:mm:ss")
    );
    var shiftInitHours = moment.duration(shiftInit).asHours(); //calcula quantas horas teve antes do mostrado da tabela

    var shiftFinal = moment(end, "DD/MM/YYYY HH:mm:ss").diff(
      moment(times[times.length - 1], "DD/MM/YYYY HH:mm:ss")
    );
    var shiftFinalHours = moment.duration(shiftFinal).asHours(); //calcula quantas horas teve depois do mostrado da tabela

    if (types[0] == true) {
      //se for working as horas acrescentadas serão no available
      work = auxTime;
      available = shiftHours - work;
    } else {
      available = auxTime;
      if (available > 0) {
        work = shiftHours - available + shiftInitHours;
      }
    }

    if (types[types.length - 1] == true) {
      work = work + shiftFinalHours;
    } else {
      available = available + shiftFinalHours;
    }

    return response.json({
      datas,
      work: work.toFixed(2),
      available: available.toFixed(2),
      shift: (shiftHours + shiftFinalHours).toFixed(2),
    });
  }

  async state(request, response) {
    const { name } = request.params;

    const machine = await knex("machines").where({ name }).first();

    if (!machine) {
      throw new AppError("Não foi possível encontrar a máquina (machine_id)");
    }

    const data = await knex("workdata")
      .select([
        "workdata.machine_id",
        "workdata.working",
        "workdata.available",
        "workdata.timestamp",
      ])
      .where("workdata.machine_id", machine.id)
      .orderBy("timestamp", "desc")
      .first();

    return response.json({
      data,
    });
  }
}
module.exports = WorkDataController;
