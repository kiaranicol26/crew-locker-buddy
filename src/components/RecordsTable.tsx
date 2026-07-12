import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, logAction } from "@/lib/session";
import { notifyDiscord } from "@/lib/discord";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  Plus,
  Trash2,
  Download,
  FileImage,
  Eraser,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toPng } from "html-to-image";
import jsPDF from "jspdf";

import {
  EditRecordDialog,
  type RecordRow
} from "./EditRecordDialog";



const COLS: { key: keyof RecordRow; label: string }[] = [

  { key: "nombre_old", label: "NOMBRE ANTERIOR" },

  { key: "nombre_new", label: "NOMBRE ACTUAL" },

  { key: "motivo", label: "MOTIVO" },

  { key: "rango_old", label: "RANGO ANTERIOR" },

  { key: "rango_new", label: "RANGO ACTUAL" },

  { key: "discord", label: "DISCORD" },

  { key: "nota_final", label: "NOTA FINAL" },

  { key: "instructor_asignado", label: "NOTA ADICIONAL" },

];





export function RecordsTable({
  session
}: {
  session: Session
}) {


  const [rows, setRows] =
    useState<RecordRow[]>([]);


  const [loading, setLoading] =
    useState(true);



  const [editing, setEditing] =
    useState<RecordRow | null>(null);



  const [pasaOpen, setPasaOpen] =
    useState<RecordRow | null>(null);




  const isComisario =
    session.is_alto_mando;



  const canDelete =
    session.is_alto_mando ||
    session.can_delete;





  async function load() {


    const {
      data,
      error
    } = await supabase

      .from("records")

      .select("*")

      .order(
        "created_at",
        {
          ascending: true
        }
      );




    if (error) {

      toast.error(
        error.message
      );

    } else {

      setRows(
        (data ?? []) as RecordRow[]
      );

    }



    setLoading(false);

  }





  useEffect(() => {

    load();

  }, []);







  async function addRow() {



    const {
      data,
      error
    } = await supabase

      .from("records")

      .insert({

        updated_by: session.id,

        ultima_edicion_por:
          session.name,

      } as any)

      .select()

      .single();





    if (error)

      return toast.error(
        error.message
      );






    setRows(r => [

      ...r,

      data as RecordRow

    ]);







    await logAction(

      supabase,

      session,

      "CREATE_RECORD",

      {
        id: data.id
      }

    );







    await notifyDiscord({

      policiaId:
        session.id,

      policiaName:
        session.name,


      action:
        "Creado",


      section:
        "Registros de la Policía",


      targetName:
        "(nuevo registro)",

    });






    setEditing(
      data as RecordRow
    );


  }






  async function deleteRow(
    row: RecordRow
  ) {



    if (!canDelete) {

      toast.error(
        "No tenés permisos para eliminar registros"
      );

      return;

    }






    if (

      !confirm(

        `¿Eliminar registro de ${
          row.nombre_new ||
          row.nombre_old ||
          "este policía"
        }?`

      )

    )

      return;






    const {
      error
    } = await supabase

      .from("records")

      .delete()

      .eq(
        "id",
        row.id
      );






    if (error)

      return toast.error(
        error.message
      );






    setRows(rs =>

      rs.filter(
        r =>
          r.id !== row.id
      )

    );






    await logAction(

      supabase,

      session,

      "DELETE_RECORD",

      {
        id: row.id
      }

    );





    await notifyDiscord({

      policiaId:
        session.id,


      policiaName:
        session.name,


      action:
        "Eliminado",


      section:
        "Registros de la Policía",



      targetName:

        row.nombre_new ||

        row.nombre_old ||

        "(sin nombre)",


    });



  }
  
  async function clearAll() {


    if (!isComisario)

      return;





    if (

      !confirm(
        "¿Vaciar todos los registros? Esta acción no se puede deshacer."
      )

    )

      return;






    const {
      error
    } = await supabase

      .from("records")

      .delete()

      .neq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );






    if (error)

      return toast.error(
        error.message
      );





    setRows([]);






    await logAction(

      supabase,

      session,

      "CLEAR_RECORDS",

      {}

    );





    toast.success(
      "Registros eliminados correctamente"
    );


  }








  async function updatePasa(

    row: RecordRow,

    value: string

  ) {



    const previous =
      row.pasa;





    if (
      previous === value
    )

      return;






    setRows(rows =>

      rows.map(r =>

        r.id === row.id

          ? {

              ...r,

              pasa:
                value,

              ultima_edicion_por:
                session.name

            }

          : r

      )

    );







    const {
      error
    } = await supabase

      .from("records")

      .update({

        pasa:
          value,


        updated_by:
          session.id,


        ultima_edicion_por:
          session.name,


      })

      .eq(
        "id",
        row.id
      );







    if (error)

      return toast.error(
        error.message
      );







    await logAction(

      supabase,

      session,

      "UPDATE_RECORD",

      {

        id:
          row.id,


        field:
          "pasa",


        from:
          previous,


        to:
          value,

      }

    );







    await notifyDiscord({

      policiaId:
        session.id,


      policiaName:
        session.name,


      action:
        "Editado",


      section:
        "Registros de la Policía",



      targetName:

        row.nombre_new ||

        row.nombre_old ||

        "(sin nombre)",




      changes: [

        {

          field:
            "pasa",


          from:
            previous,


          to:
            value

        }

      ]

    });


  }








  async function exportImage() {



    const element =
      document.getElementById(
        "records-table-export"
      );




    if (!element)

      return;







    const image =
      await toPng(

        element,

        {

          backgroundColor:
            "#ffffff",


          pixelRatio:
            2

        }

      );






    const link =
      document.createElement(
        "a"
      );





    link.download =

      `registros-policia-${

        new Date()

          .toISOString()

          .slice(0,10)

      }.png`;






    link.href =
      image;



    link.click();


  }








  async function exportPDF() {



    const element =
      document.getElementById(
        "records-table-export"
      );





    if (!element)

      return;







    const image =
      await toPng(

        element,

        {

          backgroundColor:
            "#ffffff",


          pixelRatio:
            2

        }

      );






    const img =
      new Image();


    img.src =
      image;






    await new Promise(

      resolve =>
        (
          img.onload =
            resolve
        )

    );






    const pdf =
      new jsPDF({

        orientation:
          "landscape",


        unit:
          "px",


        format:

          [

            img.width,

            img.height

          ]

      });







    pdf.addImage(

      image,

      "PNG",

      0,

      0,

      img.width,

      img.height

    );







    pdf.save(

      `registros-policia-${

        new Date()

          .toISOString()

          .slice(0,10)

      }.pdf`

    );


  }








  if (loading)

    return (

      <div className="
        w-full
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-100
      ">


        <p className="
          text-blue-600
          font-bold
          uppercase
          tracking-widest
        ">

          Cargando registros...

        </p>


      </div>

    );








  return (

    <div className="
      w-full
      min-h-screen
      bg-slate-100
      p-3
      md:p-5
      space-y-4
    ">






      <div className="
        w-full
        bg-white
        border
        border-blue-200
        shadow-sm
        p-5
      ">




        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-4
        ">



          <div className="
            flex
            items-center
            gap-4
          ">



            <div className="
              w-14
              h-14
              flex
              items-center
              justify-center
              bg-blue-600
              text-white
              border
              border-blue-700
            ">


              <ShieldCheck
                className="
                  w-8
                  h-8
                "
              />


            </div>





            <div>



              <p className="
                text-blue-600
                text-xs
                uppercase
                font-bold
                tracking-[0.3em]
              ">

                San Andreas Police Department

              </p>




              <h2 className="
                text-3xl
                font-black
                text-slate-900
                uppercase
              ">

                Registros de la Policía

              </h2>




              <p className="
                text-slate-500
                text-sm
              ">

                Sistema de Gestión de Registros

              </p>



            </div>



          </div>
          



          <div className="
            flex
            flex-wrap
            gap-2
          ">



            <DropdownMenu>


              <DropdownMenuTrigger asChild>


                <Button

                  size="sm"

                  className="
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    border
                    border-blue-700
                    rounded-none
                  "

                >

                  <Download
                    className="
                      w-4
                      h-4
                      mr-2
                    "
                  />

                  Descargar

                </Button>


              </DropdownMenuTrigger>




              <DropdownMenuContent

                className="
                  bg-white
                  border
                  border-blue-200
                  text-slate-800
                  rounded-none
                "

              >



                <DropdownMenuItem

                  onClick={exportImage}

                  className="
                    hover:bg-blue-50
                    cursor-pointer
                  "

                >

                  <FileImage
                    className="
                      w-4
                      h-4
                      mr-2
                      text-blue-600
                    "
                  />

                  Exportar imagen


                </DropdownMenuItem>






                <DropdownMenuItem

                  onClick={exportPDF}

                  className="
                    hover:bg-blue-50
                    cursor-pointer
                  "

                >

                  <Download

                    className="
                      w-4
                      h-4
                      mr-2
                      text-blue-600
                    "

                  />


                  Exportar PDF


                </DropdownMenuItem>



              </DropdownMenuContent>


            </DropdownMenu>







            {isComisario && (



              <Button

                size="sm"

                variant="destructive"

                onClick={clearAll}

                className="
                  rounded-none
                  font-bold
                "

              >


                <Eraser

                  className="
                    w-4
                    h-4
                    mr-2
                  "

                />


                Vaciar registros


              </Button>



            )}







            <Button

              onClick={addRow}

              size="sm"

              className="
                bg-blue-600
                hover:bg-blue-700
                text-white
                rounded-none
                font-bold
              "

            >


              <Plus

                className="
                  w-4
                  h-4
                  mr-2
                "

              />


              Agregar registro


            </Button>



          </div>




        </div>



      </div>









      <div

        id="records-table-export"

        className="
          w-full
          bg-white
          border
          border-blue-200
          overflow-auto
          shadow-sm
        "

      >






        <table

          className="
            w-full
            min-w-max
            border-collapse
            text-sm
          "

        >






          <thead>


            <tr

              className="
                bg-blue-600
                text-white
              "

            >





              <th

                className="
                  p-3
                  border
                  border-blue-500
                  text-center
                  uppercase
                  font-bold
                  whitespace-nowrap
                "

              >

                PASA

              </th>








              {COLS.map(column => (


                <th

                  key={
                    column.key
                  }


                  className="
                    p-3
                    border
                    border-blue-500
                    text-left
                    uppercase
                    font-bold
                    whitespace-nowrap
                  "

                >

                  {column.label}


                </th>


              ))}








              <th

                className="
                  p-3
                  border
                  border-blue-500
                  uppercase
                  font-bold
                  whitespace-nowrap
                "

              >

                ÚLTIMA EDICIÓN POR


              </th>








              <th

                className="
                  p-3
                  border
                  border-blue-500
                  text-center
                  uppercase
                  font-bold
                "

              >

                ACCIONES


              </th>




            </tr>


          </thead>







          <tbody>






            {rows.map(row => (



              <tr


                key={
                  row.id
                }


                className="
                  hover:bg-blue-50
                  transition-colors
                "


              >






                <td

                  className="
                    p-3
                    border
                    border-slate-200
                    text-center
                  "

                >



                  <PasaSelector

                    value={
                      row.pasa
                    }


                    onChange={
                      value =>
                        updatePasa(
                          row,
                          value
                        )
                    }

                  />



                </td>

                



                {COLS.map(column => (


                  <td

                    key={
                      column.key
                    }


                    className="
                      p-3
                      border
                      border-slate-200
                      text-slate-700
                      align-middle
                      whitespace-pre-wrap
                    "

                  >


                    {(row[column.key] as string) || (

                      <span className="
                        text-slate-400
                      ">

                        —

                      </span>

                    )}



                  </td>



                ))}








                <td

                  className="
                    p-3
                    border
                    border-slate-200
                    text-sm
                    text-slate-500
                    whitespace-nowrap
                  "

                >


                  {row.ultima_edicion_por ?? "—"}



                </td>








                <td

                  className="
                    p-3
                    border
                    border-slate-200
                  "

                >



                  <div className="
                    flex
                    justify-center
                    gap-2
                  ">



                    <Button

                      size="icon"

                      variant="ghost"

                      onClick={() =>
                        setEditing(row)
                      }


                      className="
                        h-9
                        w-9
                        rounded-none
                        hover:bg-blue-100
                      "


                      title="Editar registro"

                    >


                      <Pencil

                        className="
                          w-4
                          h-4
                          text-blue-600
                        "

                      />


                    </Button>








                    {canDelete && (


                      <Button


                        size="icon"


                        variant="ghost"


                        onClick={() =>
                          deleteRow(row)
                        }



                        className="
                          h-9
                          w-9
                          rounded-none
                          hover:bg-red-100
                        "


                        title="Eliminar registro"


                      >



                        <Trash2

                          className="
                            w-4
                            h-4
                            text-red-600
                          "

                        />



                      </Button>



                    )}



                  </div>




                </td>






              </tr>



            ))}








            {rows.length === 0 && (



              <tr>


                <td

                  colSpan={
                    COLS.length + 3
                  }


                  className="
                    p-10
                    text-center
                    text-slate-400
                    uppercase
                    tracking-widest
                  "

                >


                  No hay registros disponibles


                </td>


              </tr>



            )}



          </tbody>





        </table>




      </div>









      <EditRecordDialog

        open={
          !!editing
        }


        onOpenChange={
          value => {

            if (!value)

              setEditing(null);

          }

        }


        row={
          editing
        }


        session={
          session
        }


        onSaved={
          load
        }


      />




    </div>


  );


}









export function PasaSelector({


  value,


  onChange,


}: {


  value:
    string | null;


  onChange:
    (value:string)=>void;


}) {



  const options = [



    {

      v:
        "SI",

      label:
        "SI",

      cls:
        "bg-green-600 text-white border-green-700"

    },



    {

      v:
        "NO",

      label:
        "NO",

      cls:
        "bg-red-600 text-white border-red-700"

    },



    {

      v:
        "NA",

      label:
        "N/A",

      cls:
        "bg-slate-500 text-white border-slate-600"

    },


  ];







  const current =

    value === "SI" ||
    value === "NO"

      ? value

      : "NA";







  const next = () => {


    const index =

      options.findIndex(

        option =>
          option.v === current

      );




    onChange(

      options[
        (index + 1)
        %
        options.length
      ].v

    );



  };







  const active =

    options.find(

      option =>
        option.v === current

    )!;







  return (



    <button


      type="button"


      onClick={next}



      className={`

        min-w-[55px]

        px-3

        py-2

        rounded-none

        border

        font-bold

        text-sm

        transition

        hover:scale-105

        ${active.cls}

      `}



      title="Cambiar estado"



    >



      {active.label}



    </button>



  );

}
