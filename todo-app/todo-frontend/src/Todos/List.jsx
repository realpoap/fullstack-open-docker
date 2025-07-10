import Todo from './Todo'

const TodoList = ({ todos, refreshTodos}) => {

  return (
    <>
      {todos.map((todo, index) => 
        (<Todo key={index||index} todo={todo} refreshTodos={refreshTodos}/>)
      ).reduce((acc, cur, idx) => [...acc, <hr key={`hr-${idx}`}/>, cur], [])}
    </>
  )
}

export default TodoList
