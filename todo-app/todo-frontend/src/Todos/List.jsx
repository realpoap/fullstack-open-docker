import Todo from './Todo'

const TodoList = ({ todos, deleteTodo, completeTodo}) => {

  return (
    <>
      {todos.map((todo, index) => (
  <Todo key={index} todo={todo} deleteTodo={deleteTodo} completeTodo={completeTodo}/>
)).reduce((acc, cur, idx) => [...acc, <hr key={`hr-${idx}`} />, cur], [])}

    </>
  )
}

export default TodoList
