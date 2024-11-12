import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional, IsString } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BilingCycle {
  @Prop()
  @IsOptional()
  @IsString()
  operator: string;

  @Prop()
  @IsOptional()
  @IsString()
  circle: string;
}
export class CallFlowItem {
  @Prop()
  @IsOptional()
  @IsString()
  type: string;

  @Prop()
  @IsOptional()
  @IsString()
  id?: string;

  @Prop()
  @IsOptional()
  @IsString()
  name?: string;

  @Prop()
  @IsOptional()
  @IsString()
  uid?: string;

  @Prop()
  @IsOptional()
  @IsString()
  time: string;
}
class answered_agentValue {
  @Prop()
  @IsString()
  @IsOptional()
  name: string;

  @Prop()
  @IsString()
  @IsOptional()
  number?: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_number?: string;
}
@Schema({ timestamps: true })
export class Telecommunications extends Document {
  @Prop()
  @IsOptional()
  @IsString()
  uuid: string;

  @Prop()
  @IsString()
  @IsOptional()
  call_to_number: string;

  @Prop()
  @IsString()
  @IsOptional()
  caller_id_number: string;

  @Prop()
  @IsString()
  @IsOptional()
  start_stamp: string;

  @Prop()
  @IsString()
  @IsOptional()
  answer_stamp: string;

  @Prop()
  @IsString()
  @IsOptional()
  end_stamp: string;

  @Prop()
  @IsString()
  @IsOptional()
  hangup_cause: string;

  @Prop()
  @IsString()
  @IsOptional()
  billsec: string;

  @IsOptional()
  @IsString({ each: true })
  digits_dialed: string[];

  @Prop()
  @IsString()
  @IsOptional()
  direction: string;

  @Prop()
  @IsString()
  @IsOptional()
  duration: string;

  @Prop()
  @IsOptional()
  answered_agent: answered_agentValue;

  @Prop()
  @IsString()
  @IsOptional()
  answered_agent_name: string;

  @Prop()
  @IsString()
  @IsOptional()
  answered_agent_number: string;

  @Prop()
  @IsOptional()
  missed_agent:
    | {
        id: string;
        name: string;
        number: string;
        agent_number: string;
      }[]
    | null;

  @Prop()
  @IsOptional()
  call_flow: CallFlowItem;

  @Prop()
  @IsString()
  @IsOptional()
  broadcast_lead_fields: string;

  @Prop()
  @IsString()
  @IsOptional()
  recording_url: string;

  @Prop()
  @IsString()
  @IsOptional()
  call_id: string;

  @Prop()
  @IsString()
  @IsOptional()
  outbound_sec: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_ring_time: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_transfer_ring_time: string;

  @Prop()
  @IsOptional()
  billing_circle: BilingCycle;

  @Prop()
  @IsString()
  @IsOptional()
  aws_call_recording_identifier: string;

  @Prop()
  @IsString()
  @IsOptional()
  customer_number_with_prefix: string;

  @Prop()
  @IsString()
  @IsOptional()
  campaign_name: string;

  @Prop()
  @IsString()
  @IsOptional()
  campaign_id: string;

  @Prop()
  @IsString()
  @IsOptional()
  call_status: string;

  @Prop()
  @IsString()
  @IsOptional()
  customer_number: string;

  @Prop()
  @IsString()
  @IsOptional()
  ivr_id: string;

  @Prop()
  @IsString()
  @IsOptional()
  ivr_name: string;

  @Prop()
  @IsString()
  @IsOptional()
  answer_agent_number: string;

  @Prop()
  @IsString()
  @IsOptional()
  call_connected: string;

  @Prop()
  @IsString()
  @IsOptional()
  lead_fields: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_name: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_number: string;

  @Prop()
  @IsString()
  @IsOptional()
  agent_id: string;

  @Prop()
  @IsString()
  @IsOptional()
  dept_id: string;

  @Prop()
  @IsString()
  @IsOptional()
  dept_name: string;

  @Prop()
  @IsString()
  @IsOptional()
  date: string;
}

export const TelecommunicationsSchema =
  SchemaFactory.createForClass(Telecommunications);
