import React from 'react';

const SuccessTx = (props) => {
    const { lastTxId, lastTxResp } = props;

    let blockExpUrl = `https://eosflare.io/tx/${lastTxId}`;
    let shortString = (lastTxId).substring(0, 30);
    return (
        <div>
            <h5>{lastTxResp}:</h5> <a className="successMsg" href={blockExpUrl} target="_blank">{shortString}...</a>
        </div>
    );
}

export default SuccessTx;