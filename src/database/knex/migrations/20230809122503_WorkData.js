
exports.up = knex => knex.schema.createTable("workdata", table => {
    table.increments("id")
    table.integer("machine_id").references("id").inTable("machines")
    table.boolean("available")
    table.boolean("working")
    table.timestamp("timestamp", { useTz: true }).default(knex.fn.now())
});
  

exports.down = knex => knex.schema.dropTable("workdata");
