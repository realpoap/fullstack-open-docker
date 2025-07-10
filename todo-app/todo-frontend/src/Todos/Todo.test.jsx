import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import Todo from './Todo'

test('renders todo', () => {
	const todo = {
		text: "Test the frontend",
		done: true
	}

	const {container} = render(<Todo todo={todo}/>)

	const span = container.querySelector('#todo-text')
	expect(span).toHaveTextContent('Test the frontend')
})