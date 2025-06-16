/// <reference types="@testing-library/jest-dom" />

declare global {
	namespace jest {
		interface Matchers<R> {
			toBeInTheDocument(): R
			toHaveClass(className: string, ...classNames: string[]): R
			toHaveStyle(style: string | Record<string, unknown>): R
			toBeDisabled(): R
			toBeEnabled(): R
			toBeVisible(): R
			toBeEmptyDOMElement(): R
			toHaveAttribute(attr: string, value?: string): R
			toHaveTextContent(text: string | RegExp): R
		}
	}
}
