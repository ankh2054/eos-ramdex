
import React from 'react';

const ErrorTx = (props) => {
    const { lastTxResp } = props;
    return (
        <div>
            <h5>Error:</h5> <p>{lastTxResp}</p>
        </div>
    );
}

export default ErrorTx;