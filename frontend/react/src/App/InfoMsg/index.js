import React from 'react';

const InfoMsg = (props) => {
    const { lastTxResp } = props;
    return (
        <div>
            <h5>Info:</h5> <p>{lastTxResp}</p>
        </div>
    );
}

export default InfoMsg;





