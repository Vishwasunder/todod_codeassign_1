const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const {format} = require('date-fns')
const isValid = require('date-fns/isValid')
const path = require('path')
const app = express()
app.use(express.json())

let db = null
const dbpath = path.join(__dirname, 'todoApplication.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
  }
}
initializeDBAndServer()

const isStatusValid = status => {
  return status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE'
}

const isPriorityValid = priority => {
  return priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW'
}

const isCategoryValid = category => {
  return category === 'WORK' || category === 'HOME' || category === 'LEARNING'
}

//covert
const covertAsrequired = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}
//API 1
app.get('/todos/', async (request, response) => {
  const {status, priority, search_q = '', category} = request.query
  switch (true) {
    case category !== undefined && priority !== undefined:
      if (isCategoryValid(category)) {
        if (isPriorityValid(priority)) {
          const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}' AND priority = '${priority}';`
          const todoDetails = await db.all(getDetails)
          response.send(todoDetails.map(each => covertAsrequired(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case category !== undefined && status !== undefined:
      if (isCategoryValid(category)) {
        if (isStatusValid(status)) {
          const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND category = '${category}';`
          const tododetails = await db.all(getDetails)
          response.send(tododetails.map(each => covertAsrequired(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case priority !== undefined && status !== undefined:
      if (isPriorityValid(priority)) {
        if (isStatusValid(status)) {
          const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}';`
          const todoDetails = await db.all(getDetails)
          response.send(todoDetails.map(each => covertAsrequired(each)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case status !== undefined:
      if (isStatusValid(status)) {
        const getDeatails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}';`
        const todoDetails = await db.all(getDeatails)
        response.send(todoDetails.map(each => covertAsrequired(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case priority !== undefined:
      if (isPriorityValid(priority)) {
        const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}';`
        const todoDetails = await db.all(getDetails)
        response.send(todoDetails.map(each => covertAsrequired(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case category !== undefined:
      if (isCategoryValid(category)) {
        const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category = '${category}';`
        const todoDetails = await db.all(getDetails)
        response.send(todoDetails.map(each => covertAsrequired(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      const getDetails = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      const todoDetails = await db.all(getDetails)
      response.send(todoDetails.map(each => covertAsrequired(each)))
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getDeatils = `SELECT * FROM todo WHERE id = ${todoId};`
  const todoDetails = await db.get(getDeatils)
  response.send(covertAsrequired(todoDetails))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const year = date.split('-')[0]
  const month = date.split('-')[1] - 1
  const day = date.split('-')[2]
  const valid = isValid(new Date(date))
  // console.log(valid)
  if (valid) {
    const dateForm = format(new Date(year, month, day), 'yyyy-MM-dd')
    console.log(dateForm)
    const getDetails = `SELECT * FROM todo WHERE due_date = '${dateForm}';`
    const details = await db.all(getDetails)
    response.send(covertAsrequired(details))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (isPriorityValid(priority)) {
    if (isStatusValid(status)) {
      if (isCategoryValid(category)) {
        const validDate = isValid(new Date(dueDate))
        if (validDate) {
          const addtodo = `INSERT INTO 
          todo (id, todo, category, priority, status, due_date)
          VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${dueDate}');`
          await db.run(addtodo)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

// API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }
  const gettodo = `SELECT * FROM todo WHERE id = ${todoId};`
  const currentDetails = await db.get(gettodo)
  const {
    status = currentDetails.status,
    priority = currentDetails.priority,
    todo = currentDetails.todo,
    category = currentDetails.category,
    dueDate = currentDetails.due_date,
  } = request.body

  if (isPriorityValid(priority)) {
    if (isStatusValid(status)) {
      if (isCategoryValid(category)) {
        const validDate = isValid(new Date(dueDate))
        if (validDate) {
          const upadate = `
            UPDATE
              todo
            SET 
            status = '${status}',
            priority = '${priority}',
            todo = '${todo}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`
          await db.run(upadate)
          response.send(`${updateColumn} Updated`)
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM todo WHERE todo = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
