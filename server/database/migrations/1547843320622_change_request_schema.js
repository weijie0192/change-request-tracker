'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

/**
 * Create change request table inside database
 */
class ChangeRequestSchema extends Schema {

  up () {
    this.create('change_requests', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('title', 254).notNullable()
      table.string('status', 20).notNullable().defaultTo("To Do")
      table.text('details','longtext')
      table.timestamps()
    })
  }

  down () {
    this.drop('change_requests')
  }
}

module.exports = ChangeRequestSchema