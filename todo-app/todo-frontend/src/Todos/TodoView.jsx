import { useEffect, useState } from 'react'
import axios from '../util/apiClient'

import Form from './Form'
import List from './List'

const TodoView = () => {
  const [todos, setTodos] = useState([])

  const refreshTodos = async () => {
    const { data } = await axios.get('/todos')
    setTodos(data)
  }

  useEffect(() => {
    refreshTodos()
  }, [])

  const createTodo = async (todo) => {
    const { data } = await axios.post('/todos', todo)
    setTodos([...todos, data])
  }

  const deleteTodo = async (todo) => {
    await axios.delete(`/todos/${todo._id}`)
    refreshTodos()
  }

 const completeTodo = async (todo) => {
  // Optimistic UI update
  const updatedTodos = todos.map(t => 
    t._id === todo._id ? { ...t, done: true } : t
  );
  setTodos(updatedTodos);

  try {
    // Send the PUT request to the backend to update the todo
    const { data } = await axios.put(`/todos/${todo._id}`, { ...todo, done: true });

    // Once the backend update is confirmed, re-fetch todos
    refreshTodos();
  } catch (error) {
    console.error("Error updating todo:", error);
    // Optionally, you can revert the optimistic UI update in case of error
    //setTodos([...todos]);
  }
}

  return (
    <>
      <h1>Todos live</h1>
      <Form createTodo={createTodo} />
      <List todos={todos} deleteTodo={deleteTodo} completeTodo={completeTodo} />
    </>
  )
}

export default TodoView
