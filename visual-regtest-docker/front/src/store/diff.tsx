import { create } from 'zustand'

type Creds = {
    username?: string,
    password?: string
}

type Alert = {
    message: string | React.ReactNode,
    type: 'success' | 'destructive' | 'warning' | 'default'
}

type FolderStructure = Array<{
    [key: string]: Array<{
        [key: string]: string[];
    } | string>;
}>;

type DiffState = {
    url: string,
    searchTerm: string,
    creds: Creds | undefined,
    delay: number | undefined,
    alert: Alert,
    folderList: FolderStructure,
    setUrl: (url: string) => void,
    setSearchTerm: (searchTerm: string) => void,
    setCreds: (creds: Creds) => void,
    setDelay: (delay: number) => void,
    setAlert: (alert: Alert) => void,
    setFolderList: (folderList: FolderStructure) => void,
}

// Store definition
export const useDiffState = create<DiffState>()((set) => ({
    url: '',
    searchTerm: '',
    creds: undefined,
    delay: undefined,
    alert: { message: '', type: 'default' },
    folderList: [],
    setUrl: (url) => set({ url }),
    setSearchTerm: (searchTerm) => set({ searchTerm }),
    setCreds: (creds) => set({ creds }),
    setDelay: (delay) => set({ delay }),
    setAlert: (alert) => set({ alert }),
    setFolderList: (folderList) => set({ folderList }),
}))