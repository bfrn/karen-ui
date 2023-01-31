import { writable, type Writable } from "svelte/store";

class UiState {
    globalCycleButton: boolean

    nodeCycleButton: boolean

    showParents: boolean
    showGrandparents: boolean
    showChildren: boolean
    showGrandchildren: boolean


    constructor(
        globalCycleButton: boolean,
        nodeCycleButton: boolean,
        showParents: boolean,
        showGrandparents: boolean,
        showChildren: boolean,
        showGrandchildren: boolean,
    ) {
        this.globalCycleButton = globalCycleButton
        this.nodeCycleButton = nodeCycleButton
        this.showParents = showParents
        this.showGrandparents = showGrandparents
        this.showChildren = showChildren
        this.showGrandchildren = showGrandchildren
    }

}

class IamVisualizerState {
    nodeIdWriteable: Writable<string>;
    lastHighlightedNodeWriteable: Writable<string>;
    currentUiStateWritable: Writable<UiState>
    currentUiState: UiState
    lastUiStateWritable: Writable<UiState>
    lastUiState: UiState

    nodeId: string
    lastHighlightedNode: string

    constructor() {
        this.currentUiState = new UiState(false, false, false, false, false, false)
        this.currentUiStateWritable = writable(new UiState(false, false, false, false, false, false))
        this.currentUiStateWritable.subscribe(newCurrentUiState => this.currentUiState = newCurrentUiState)

        this.lastUiState = new UiState(false, false, false, false, false, false)
        this.lastUiStateWritable = writable(new UiState(false, false, false, false, false, false))
        this.lastUiStateWritable.subscribe(newLastUiState => this.lastUiState = newLastUiState)

        this.nodeIdWriteable = writable("")
        this.lastHighlightedNodeWriteable = writable("")
        this.nodeId = ""
        this.lastHighlightedNode = ""
        this.nodeIdWriteable.subscribe(newNodeId => this.nodeId = newNodeId)
        this.lastHighlightedNodeWriteable.subscribe(newLastHighlightedNode => this.lastHighlightedNode = newLastHighlightedNode)
    }

    setNodeId(newNodeId: string) {
        if (newNodeId !== this.lastHighlightedNode) {
            this.currentUiStateWritable.set(new UiState(this.currentUiState.globalCycleButton, false, false, false, false, false))
        } else if (newNodeId === this.lastHighlightedNode) {
            this.lastUiStateWritable.update(uiState => {
                uiState.globalCycleButton = this.currentUiState.globalCycleButton
                return uiState
            })
            this.currentUiStateWritable.set(this.lastUiState)
        }
        this.nodeIdWriteable.set(newNodeId)
    }

    setLastUiState() {
        this.lastHighlightedNodeWriteable.set(this.nodeId)
        this.lastUiStateWritable.set(this.currentUiState)
    }

    setRelativeButtons(showParents: boolean, showGrandparents: boolean, showChildren: boolean, showGrandchildren: boolean) {
        this.currentUiStateWritable.update(uiState => {
            uiState.showParents = showParents
            uiState.showGrandparents = showGrandparents
            uiState.showChildren = showChildren
            uiState.showGrandchildren = showGrandchildren

            uiState.globalCycleButton = false
            uiState.nodeCycleButton = false
            return uiState
        })
        this.setLastUiState()
    }

    setGlobalCycleButton(globalCycleButton: boolean) {
        this.currentUiStateWritable.update(uiState => {
            uiState.globalCycleButton = globalCycleButton

            uiState.showParents = false
            uiState.showGrandparents = false
            uiState.showChildren = false
            uiState.showGrandchildren = false
            uiState.nodeCycleButton = false
            return uiState
        })
    }

    setNodeCycleButton(nodeCycleButton: boolean) {
        this.currentUiStateWritable.update(uiState => {
            uiState.nodeCycleButton = nodeCycleButton

            uiState.showParents = false
            uiState.showGrandparents = false
            uiState.showChildren = false
            uiState.showGrandchildren = false
            uiState.globalCycleButton = false
            return uiState
        })
        this.setLastUiState()
    }

    resetAllButtons() {
        this.currentUiStateWritable.update(uiState => {
            uiState.showParents = false
            uiState.showGrandparents = false
            uiState.showChildren = false
            uiState.showGrandchildren = false
            uiState.nodeCycleButton = false
            uiState.globalCycleButton = false
            return uiState
        })
        this.lastUiStateWritable.set(this.currentUiState)
        this.lastHighlightedNodeWriteable.set("")

    }

}

export {
    UiState,
    IamVisualizerState,
}

export const iamViusalizerState = new IamVisualizerState()