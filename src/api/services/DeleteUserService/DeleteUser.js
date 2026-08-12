import API from "../..";

export const DeleteUser = async () => {
    return API.delete("/user/account")
}