
type Position = (number|Position)[]

export interface Object3DOptions{
    type:"box"|"light",
    position: Position,
    appearance:{
        [key:string]:any
    }
}