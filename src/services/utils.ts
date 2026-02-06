export const validateRut = (rut: string) => {
    if (!rut) return true;
    const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
    if (cleanRut.length < 8) return false;
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    let sum = 0;
    let mul = 2;
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * mul;
        mul = mul === 7 ? 2 : mul + 1;
    }

    const expectedDv = 11 - (sum % 11);
    const dvd = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
    return dv === dvd;
};

export const formatRut = (rut: string) => {
    let value = rut.replace(/\./g, "").replace("-", "");
    if (value.length <= 1) return value;
    let body = value.slice(0, -1);
    let dv = value.slice(-1).toUpperCase();
    return body.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") + "-" + dv;
};
