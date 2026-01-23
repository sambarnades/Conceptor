export const machineName = 'H5P.AdvancedBlanks';
export const version = { major: 1, minor: 2 };
export const extraDependencies = [{ machineName: 'H5P.MathDisplay', majorVersion: 1, minorVersion: 0 }];

export default {
    process: (jsonObj) => {
        return { ...jsonObj }; // Le JSON est déjà au bon format
    }
};
