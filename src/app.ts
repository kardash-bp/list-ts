// Validation
interface Validate {
  value: string | number
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
}
function validate(obj: Validate) {
  let isValid = true
  if (obj.required) {
    isValid = isValid && obj.value.toString().trim().length !== 0
  }
  if (obj.minLength != null && typeof obj.value === 'string') {
    isValid = isValid && obj.value.trim().length >= obj.minLength
  }
  if (obj.maxLength != null && typeof obj.value === 'string') {
    isValid = isValid && obj.value.trim().length <= obj.maxLength
  }
  if (obj.min != null && typeof obj.value === 'number') {
    isValid = isValid && obj.value >= obj.min
  }
  if (obj.max != null && typeof obj.value === 'number') {
    isValid = isValid && obj.value <= obj.max
  }
  return isValid
}

class ProjectList {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLElement

  constructor(private type: 'active' | 'finished') {
    this.templateElement = document.querySelector('#project-list')!
    this.hostElement = document.querySelector('#app')!

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as HTMLElement
    this.element.id = `${this.type}-projects`
    this.element.querySelector('ul')!.id = `${this.type}-projects-list`
    this.element.querySelector(
      'h2'
    )!.textContent = `${this.type.toUpperCase()} PROJECTS`
    this.attach()
  }
  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element)
  }
}
class ProjectInput {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLFormElement
  titleInput: HTMLInputElement
  descriptionInput: HTMLInputElement
  peopleInput: HTMLInputElement
  constructor() {
    this.templateElement = document.querySelector('#project-input')!
    this.hostElement = document.querySelector('#app')!

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as HTMLFormElement
    this.element.id = 'user-input'

    this.titleInput = this.element.querySelector('#title')!
    this.descriptionInput = this.element.querySelector('#description')!
    this.peopleInput = this.element.querySelector('#people')!

    this.submitHandler = this.submitHandler.bind(this)
    this.listening()
    this.attach()
  }
  // attach template form to app
  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element)
  }

  private clearInputs = () => {
    this.titleInput.value = ''
    this.descriptionInput.value = ''
    this.peopleInput.value = ''
  }

  private getInputs = (): [string, string, number] | void => {
    const title = this.titleInput.value
    const description = this.descriptionInput.value
    const people = +this.peopleInput.value
    const validTitle: Validate = {
      value: title,
      required: true,
    }
    const validDescription: Validate = {
      value: description,
      required: true,
      minLength: 5,
      maxLength: 99,
    }
    const validPeople: Validate = {
      value: people,
      required: true,
      min: 1,
      max: 5,
    }
    if (
      !validate(validTitle) ||
      !validate(validDescription) ||
      !validate(validPeople)
    ) {
      alert('Invalid input, please try again.')
      return
    }
    return [title, description, people]
  }
  private submitHandler(e: Event) {
    e.preventDefault()
    const userInput = this.getInputs()
    if (Array.isArray(userInput)) {
      console.log(userInput)
      this.clearInputs()
    }
  }

  private listening() {
    this.element.addEventListener('submit', this.submitHandler)
  }
}
/**
 * The Singleton class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
class ProjectState {
  private projects: any[] = []

  addProject(title: string, description: string, numOfPeople: number) {
    this.projects.push({
      id: new Date().getTime().toString(),
      title,
      description,
      people: numOfPeople,
    })
  }
}
const projectState = new ProjectState()
const project = new ProjectInput()
const activeList = new ProjectList('active')
const finishedList = new ProjectList('finished')
console.log(new Date().getTime())