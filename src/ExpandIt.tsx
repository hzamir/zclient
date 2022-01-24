import React, {useState} from 'react';

interface ExpanditProps {
  title:string;
  children?: React.ReactNode;
}
export const Expandit = (props:ExpanditProps) => {
  const [expanded, setExpanded] = useState(false);
  const {title, children} = props;
    return (
      <div onClick={()=>setExpanded(!expanded)}>
      {title}<br/>
      {expanded && <div>{children}</div>}
      </div>
    );

}

