import React, { useRef} from 'react';
// import "ag-grid-enterprise";
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-dark.css';

const style = {height: '100%', width: '100%'};

export const  MyGrid = ({rowData, columnDefs, ref}) => {
    const gridRef = useRef(null);
    return (
        <div className="ag-theme-dark" style={style}>
            <AgGridReact
                ref={gridRef}
                immutableData={true}
                defaultColDef={{enableRowGroup:true}}
                toolPanel={'columns'}
                showToolPanel={true}
                reactNext={true}
                getRowNodeId={data=>data.id}
                columnDefs={columnDefs} rowData={rowData}/>
        </div>
    );
}
