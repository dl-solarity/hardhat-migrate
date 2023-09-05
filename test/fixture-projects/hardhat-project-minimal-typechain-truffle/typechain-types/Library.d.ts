/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from "bn.js";
import { EventData, PastEventOptions } from "web3-eth-contract";

export interface LibraryContract extends Truffle.Contract<LibraryInstance> {
  "new"(meta?: Truffle.TransactionDetails): Promise<LibraryInstance>;
}

type AllEvents = never;

export interface LibraryInstance extends Truffle.ContractInstance {
  lib(txDetails?: Truffle.TransactionDetails): Promise<void>;

  methods: {
    lib(txDetails?: Truffle.TransactionDetails): Promise<void>;
  };

  getPastEvents(event: string): Promise<EventData[]>;
  getPastEvents(
    event: string,
    options: PastEventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>;
  getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]>;
  getPastEvents(event: string, callback: (error: Error, event: EventData) => void): Promise<EventData[]>;
}