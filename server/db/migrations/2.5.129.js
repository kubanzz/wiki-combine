exports.up = knex => {
  return knex.schema
    .alterTable('pageTree', table => {
      table.integer('creatorId').unsigned()
    })
}

exports.down = knex => { }
