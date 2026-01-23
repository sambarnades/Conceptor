export const machineName = 'H5P.Chart';
export const version = { major: 1, minor: 2 };

export default {
    process: (jsonObj) => {
        return { ...jsonObj };
    }
};
