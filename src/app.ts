// Validation
interface Validate {
  value: string | number
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
}
// drag & drop
interface Draggable {
  dragStart(e: DragEvent): void
  dragEnd(e: DragEvent): void
}
interface DropTarget {
  dragOver(e: DragEvent): void
  drop(e: DragEvent): void
  dragLeave(e: DragEvent): void
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

// base class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement
  hostElement: T
  element: U

  constructor(
    templateId: string,
    hostId: string,
    insertPlace: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    )! as HTMLTemplateElement
    this.hostElement = document.getElementById(hostId)! as T

    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as U
    if (newElementId) {
      this.element.id = newElementId
    }

    this.attach(insertPlace)
  }
  private attach(insertStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertStart ? 'afterbegin' : 'beforeend',
      this.element
    )
  }
}
class ProjectItem
  extends Component<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private project: Project

  get persons() {
    return this.project.people === 1
      ? '1 person'
      : `${this.project.people} persons `
  }

  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id)
    this.project = project
    this.renderContent()
    this.configure()
  }
  dragStart = (e: DragEvent) => {
    e.dataTransfer!.setData('text/plain', this.project.id)
    e.dataTransfer!.effectAllowed = 'move'
  }
  dragEnd = (_: DragEvent) => {
    console.log('drag end')
  }

  configure = () => {
    this.element.addEventListener('dragstart', this.dragStart)
    this.element.addEventListener('dragend', this.dragEnd)
  }

  private renderContent = () => {
    this.element.querySelector('h2')!.textContent = this.project.title
    this.element.querySelector('h3')!.textContent = this.persons + ' assigned'
    this.element.querySelector('p')!.textContent = this.project.description
  }
}
class ProjectList
  extends Component<HTMLDivElement, HTMLElement>
  implements DropTarget
{
  assignedProjects: Project[]

  constructor(private type: 'active' | 'finished') {
    super('project-list', 'app', false, `${type}-projects`)

    this.element.querySelector('ul')!.id = `${this.type}-projects-list`
    this.element.querySelector(
      'h2'
    )!.textContent = `${this.type.toUpperCase()} PROJECTS`
    this.assignedProjects = []

    projectState.addListener((projects: Project[]) => {
      this.assignedProjects = projects
      this.renderProjects()
    })
    this.configure()
  }

  dragOver = (e: DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types[0] === 'text/plain') {
      e.preventDefault()

      const target = this.element.querySelector('ul')!
      target.classList.add('droppable')
    }
  }
  drop = (e: DragEvent) => {
    const prjId = e.dataTransfer!.getData('text/plain')
    projectState.moveProject(prjId, this.type)
  }
  dragLeave = (_: DragEvent) => {
    const ul = this.element.querySelector('ul')!
    ul.classList.remove('droppable')
  }

  private configure() {
    this.element.addEventListener('dragover', this.dragOver)
    this.element.addEventListener('dragleave', this.dragLeave)
    this.element.addEventListener('drop', this.drop)
  }
  private renderProjects() {
    const ul = document.getElementById(`${this.type}-projects-list`)!
    ul.innerHTML = ''
    for (const p of this.assignedProjects) {
      if (this.type !== p.status) return
      new ProjectItem(this.element.querySelector('ul')!.id, p)
    }
  }
}
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInput: HTMLInputElement
  descriptionInput: HTMLInputElement
  peopleInput: HTMLInputElement
  constructor() {
    super('project-input', 'app', true, 'user-input')

    this.titleInput = this.element.querySelector('#title')!
    this.descriptionInput = this.element.querySelector('#description')!
    this.peopleInput = this.element.querySelector('#people')!

    this.submitHandler = this.submitHandler.bind(this)
    this.listening()
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
      const [title, description, people] = userInput
      projectState.addProject(title, description, people)
      this.clearInputs()
    }
  }

  private listening() {
    this.element.addEventListener('submit', this.submitHandler)
  }
}

// Project Class
class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: 'active' | 'finished'
  ) {}
}
type Listener = (p: Project[]) => void
/**
 * The class defines the `getInstance` method that lets clients access
 * the unique singleton instance.
 */
class ProjectState {
  private listeners: Listener[] = []
  private projects: Project[] = []
  private static instance: ProjectState

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ProjectState()
    }
    return this.instance
  }

  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn)
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const proj = new Project(
      new Date().getTime().toString(),
      title,
      description,
      numOfPeople,
      'active'
    )
    this.projects.push(proj)
    this.updateListeners()
  }
  moveProject = (projectId: string, newStatus: 'active' | 'finished') => {
    const project = this.projects.find((p) => p.id === projectId)
    if (project && project.status !== newStatus) {
      project.status = newStatus
      this.updateListeners()
    }
  }
  private updateListeners = () => {
    for (const l of this.listeners) {
      l(this.projects.slice())
    }
  }
}
const projectState = ProjectState.getInstance()
const projectInput = new ProjectInput()
const activeList = new ProjectList('active')
const finishedList = new ProjectList('finished')
console.log('State: ' + projectState)
