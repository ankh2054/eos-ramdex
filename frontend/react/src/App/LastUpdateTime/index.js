import moment from 'moment';
import React from 'react';

const LastUpdateTime = (props) => {
    const { lastUpdateTimestamp } = props;
    if (lastUpdateTimestamp) {
        return (
            <strong>{moment.utc(lastUpdateTimestamp).format('YYYY-MM-DD HH:mm:ss')}</strong>
        );
    } else {
        return (
            null
        );
    }
}

export default LastUpdateTime ;