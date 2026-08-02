import { responseType } from "./constant.js";


export const catchSuccessResponse = (successMessage = '') => ({
    success: true,
    type: responseType['S'],
    message: successMessage || 'Successful',
})

export const catchErrorResponse = (errorMessage = '') => ({
    success: false,
    type: responseType['E'],
    message: errorMessage || 'Request faced internal server error',
});