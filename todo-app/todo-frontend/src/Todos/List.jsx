import Todo from './Todo'

const TodoList = ({ todos, deleteTodo, completeTodo }) => {

  return (
    <>
      {todos.map(todo => {
        <Todo key={todo.text} todo={todo}/>
      }).reduce((acc, cur) => [...acc, <hr />, cur], [])}
    </>
  )
}

export default TodoList
