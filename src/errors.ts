export class TodoManagerError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, TodoManagerError.prototype);
  }
}

export class NotImplementedError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

export class EntityNotFoundError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}

export class SavingRequiredError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, SavingRequiredError.prototype);
  }
}

export class BoardTaskWithoutStepError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, BoardTaskWithoutStepError.prototype);
  }
}

export class InvalidFlowStepError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, InvalidFlowStepError.prototype);
  }
}

export class FlowStepInUseError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, FlowStepInUseError.prototype);
  }
}

export class InvalidBoardAssociationError extends TodoManagerError {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, InvalidBoardAssociationError.prototype);
  }
}
