export type Horario = {
  grado: string;
  apellidos: string;
  nombre: string;
  clave: string;
  grupo: string;
  asignatura: string;
  inicio: string;
  fin: string;
  salon: string;
};

export const horarios9114: Horario[] = [
  {
    grado: "Mtra.",
    apellidos: "Trigueros Olivares",
    nombre: "Roxana",
    clave: "1122",
    grupo: "9114",
    asignatura: "Derecho romano I (Primer ingreso)",
    inicio: "07:00",
    fin: "08:00",
    salon: "D-106",
  },
  {
    grado: "Lic.",
    apellidos: "Belmont Martínez",
    nombre: "Arturo",
    clave: "1121",
    grupo: "9114",
    asignatura: "Acto jurídico y derecho de las personas (Primer ingreso)",
    inicio: "08:00",
    fin: "09:00",
    salon: "D-106",
  },
  {
    grado: "Lic.",
    apellidos: "Barco Martínez",
    nombre: "Dionisio Eduardo",
    clave: "1123",
    grupo: "9114",
    asignatura: "Historia del derecho mexicano (Primer ingreso)",
    inicio: "09:00",
    fin: "10:00",
    salon: "D-106",
  },
  {
    grado: "Dr.",
    apellidos: "Cruz Vázquez",
    nombre: "Marcial Manuel",
    clave: "1127",
    grupo: "9114",
    asignatura: "Teoría general del estado (Primer ingreso)",
    inicio: "10:00",
    fin: "11:00",
    salon: "D-106",
  },
  {
    grado: "Mtra.",
    apellidos: "González Nahle",
    nombre: "María Fernanda",
    clave: "1126",
    grupo: "9114",
    asignatura: "Sociología jurídica (Primer ingreso)",
    inicio: "11:00",
    fin: "12:00",
    salon: "D-106",
  },
  {
    grado: "Mtra.",
    apellidos: "Urbina Anguas",
    nombre: "Lizzet",
    clave: "1124",
    grupo: "9114",
    asignatura: "Introducción a la teoría del derecho (Primer ingreso)",
    inicio: "12:00",
    fin: "13:00",
    salon: "D-106",
  },
  {
    grado: "Lic.",
    apellidos: "Ramírez Figueroa",
    nombre: "Apolinar Medardo",
    clave: "1125",
    grupo: "9114",
    asignatura: "Ser universitario y cultura de la legalidad (Primer ingreso)",
    inicio: "13:00",
    fin: "14:00",
    salon: "E-003",
  },
];

export const materias9114 = horarios9114.map((item) => item.asignatura);
