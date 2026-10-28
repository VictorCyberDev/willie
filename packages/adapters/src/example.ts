import {event,record,requiredString,type AdapterContext,type AdapterHealth,type ContributionProvider} from '@willie/sdk';
export class ButtonAdapter implements ContributionProvider<{sourceId:string}> {
 readonly id='button';readonly contributionTypes=['BUTTON_PRESS'] as const;private sourceId='';private context:AdapterContext|null=null;
 configure(config:{sourceId:string}):void{this.sourceId=config.sourceId;this.validateConfig()}
 validateConfig():void{requiredString(this.sourceId,'source id')}
 async connect(context:AdapterContext):Promise<void>{this.validateConfig();this.context=context}
 health():AdapterHealth{return{status:this.context?'HEALTHY':'DISCONNECTED',checkedAt:new Date(this.context?.now()??0).toISOString()}}
 async consume(input:unknown):Promise<void>{if(!this.context)throw new Error('Button adapter disconnected');const d=record(input);await this.context.emit(event('generic',requiredString(d.id,'press id'),'BUTTON_PRESS',this.sourceId,new Date(this.context.now()).toISOString(),this.context.now(),{command:'!charge',contributorId:requiredString(d.contributorId,'contributor')}))}
 async disconnect():Promise<void>{this.context=null;this.sourceId=''}
}