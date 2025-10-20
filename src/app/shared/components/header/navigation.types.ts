// Shared navigation data types for header components

export interface NavigationItemBase { 
  id: string; 
  label: string; 
  icon?: string; 
}

export interface NavigationLeaf extends NavigationItemBase { 
  path: string; 
  children?: undefined; 
}

export interface NavigationGroup extends NavigationItemBase { 
  path?: undefined; 
  children: NavigationItem[]; 
}

export type NavigationItem = NavigationLeaf | NavigationGroup;