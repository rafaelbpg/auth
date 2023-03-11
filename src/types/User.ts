import { Role } from "./Role";

export type User = {
    uuid: string,
    email: string,
    password: string,
    name: string,
    createdAt: number,
    updatedAt: number,
    isActive: boolean,
    activationCode: string,
    role : Role
};