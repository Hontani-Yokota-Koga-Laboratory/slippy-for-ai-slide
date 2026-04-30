import { createContext, useContext } from 'react'

export const ProjectContext = createContext<string>('')
export const useProject = () => useContext(ProjectContext)
