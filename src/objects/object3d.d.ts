
type Position = (number|Position)[]

export interface Object3DOptions{
    id?:string,
    type:"box"|"light",
    position: Position,
    appearance:{
        [key:string]:any
    }
}