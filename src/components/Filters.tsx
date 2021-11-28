import { Col, Row, Slider, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { distinctUntilChanged, map } from 'rxjs';
import { asEffectReset } from '../lib/rx';
import { useRxAppStore } from '../store';
import { applyYearRange } from '../store/actions/apply-year-range';
import { selectYearLimits, selectYearRange } from '../store/constant-lib';
import './Filters.scss';

export function Filters() {
  const { store, state$ } = useRxAppStore();
  const [yearLimits, setYearLimits] = useState(selectYearLimits(store.getState()).slice() as [number, number]);
  const [yearRange, setYearRange] = useState(selectYearRange(store.getState()).slice() as [number, number]);
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectYearLimits), distinctUntilChanged()).subscribe((value) => {
          setYearLimits(value.slice() as [number, number]);
        })
      ),
    [state$]
  );
  useEffect(
    () =>
      asEffectReset(
        state$.pipe(map(selectYearRange), distinctUntilChanged()).subscribe((value) => {
          setYearRange(value.slice() as [number, number]);
        })
      ),
    [state$]
  );

  return (
    <Row align={'middle'} gutter={24} justify={'space-between'}>
      <Col>
        <Typography.Text strong={true}>Years</Typography.Text>
      </Col>
      <Col flex={1}>
        <Slider
          className="flex-grow"
          range
          step={1}
          value={yearRange}
          min={yearLimits[0]}
          max={yearLimits[1]}
          defaultValue={yearLimits}
          onChange={(range: [number, number]) => {
            store.dispatch(applyYearRange(range));
          }}
        />
      </Col>
      <Col>
        <Typography.Text>{yearRange.join(' - ')}</Typography.Text>
      </Col>
    </Row>
  );
}
