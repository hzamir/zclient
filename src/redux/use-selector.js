import { useSelector as reduxUseSelector } from "react-redux";


// if we don't create our own alias to useSelector, then every component that uses it relies directly on redux
// whereas this could be satisfied with other state management libraries
export const useSelector = reduxUseSelector;
